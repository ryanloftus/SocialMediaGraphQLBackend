import { Query, Resolver, ObjectType, Field, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql'
import argon2 from 'argon2'
import { v4 } from 'uuid'
import User from '../entities/user.js'
import OperationResultResponse from '../utils/operation-result.js'
import { MyContext } from '../types/my-context.js'
import { COOKIE_NAME, ONE_DAY_IN_SECONDS, ONE_TIME_CODE_PREFIX } from '../utils/constants.js'
import { isAuth } from '../middleware/is-auth.js'
import sendOneTimeCode from '../utils/send-email.js'

@ObjectType()
class UserResponse {
    @Field(() => String, { nullable: true })
    error?: string

    @Field(() => User, { nullable: true })
    user?: User
}

@Resolver()
export default class UserResolver {
    @Mutation(() => UserResponse)
    async createUser(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Arg("confirmPassword") confirmPassword: string,
        @Ctx() { req }: MyContext,
    ): Promise<UserResponse> {

        if (/\s/g.test(username)) {
            return { error: 'username must not contain whitespace' };
        } else if (password.length < MIN_PASSWORD_LENGTH) {
            return { error: `password must be at least ${MIN_PASSWORD_LENGTH} characters long` };
        } else if (password !== confirmPassword) {
            return { error: 'confirm password does not match password' };
        }

        try {
            const hashedPassword = await argon2.hash(password);
            const user = User.create({ username: username, password: hashedPassword });
            await user.save();
            req.session.userToken = user.token;
            return { user };
        } catch (error) {
            return { error: "username already exists" };
        }
    }

    @Query(() => UserResponse)
    @UseMiddleware(isAuth)
    async me(
        @Ctx() { req }: MyContext,
    ): Promise<UserResponse> {
        try {
            const user = await User.findOne({
                where: { token: req.session.userToken },
                relations: {
                    chats: true,
                    followers: true,
                    following: true,
                    posts: true,
                },
            });
            if (!user) return { error: 'invalid login token' };
            else return { user };
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error occurred' };
        }
    }

    @Query(() => UserResponse)
    async getUser(
        @Arg("userToken") userToken: string,
    ): Promise<UserResponse> {
        try {
            const user = await User.findOne({
                where: { token: userToken },
                relations: {
                    followers: true,
                    following: true,
                    posts: true,
                },
            });
            if (!user) {
                return { error: 'no such user' };
            } else {
                return { user };
            }
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error occurred' };
        }
    }

    @Mutation(() => OperationResultResponse)
    async changePassword(
        @Arg("newPassword") newPassword: string,
        @Arg("confirmPassword") confirmPassword: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        if (newPassword !== confirmPassword) {
            return { wasSuccess: false, error: 'new password and confirm password do not match' };
        } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return { wasSuccess: false, error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` };
        }
        try {
            const user: User = await User.findOneBy({ token: req.session.userToken });
            if (!user) throw new Error(`could not find user with token: ${req.session.userToken}` );
            user.password = await argon2.hash(newPassword);
            await user.save();
            return { wasSuccess: true };
        } catch (err) {
            console.log(err.message);
            return { wasSuccess: false, error: 'unexpected error' };
        }
    }

    @Mutation(() => OperationResultResponse)
    async deleteUser(
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        const userToken = req.session.userToken;

        try {
            const user: User = await User.findOne({ where: { token: userToken } });
            await user.remove();
        } catch {
            return {
                wasSuccess: false,
                error: `user with token ${userToken} does not exist`,
            };
        }

        return { wasSuccess: true };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext,
    ): Promise<UserResponse> {
        try {
            const user = await User.findOneBy({ username: username });
            const valid = user && await argon2.verify(user.password, password);
            if (valid) {
                req.session.userToken = user.token;
                return { user };
            } else {
                return { error: 'username or password is incorrect' };
            }
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error' };
        }
    }

    @Mutation(() => OperationResultResponse)
    async logout(
        @Ctx() { req, res }: MyContext,
    ): Promise<OperationResultResponse> {
        return new Promise((resolve) => {
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) resolve({ wasSuccess: false, error: 'failed to end session' });
                else resolve({ wasSuccess: true });
            });
        })
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async follow(
        @Arg("userToFollow") userToFollowToken: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        try {
            const user = await User.findOne({
                where: { token: req.session.userToken },
                relations: { following: true },
            });
            if (!user) {
                return { wasSuccess: false, error: 'invalid login session' };
            } else if (user.following?.find((u) => u.token === userToFollowToken)) {
                return { wasSuccess: false, error: 'already following user' };
            }

            const userToFollow = await User.findOneBy({ token: userToFollowToken });
            if (!userToFollow) {
                return { wasSuccess: false, error: 'user you are trying to follow does not exist' };
            }

            if (!user.following) {
                user.following = [];
            }
            user.following.push(userToFollow);
            await user.save();
            return { wasSuccess: true };
        } catch (err) {
            console.log(err.message);
            return { wasSuccess: false, error: 'unexpected error occurred' };
        }
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async unfollow(
        @Arg("userToUnfollow") userToUnfollowToken: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        try {
            const user = await User.findOne({
                where: { token: req.session.userToken },
                relations: { following: true },
            });
            if (!user) {
                return { wasSuccess: false, error: 'invalid login session' };
            } else if (!user.following?.find((u) => u.token === userToUnfollowToken)) {
                return { wasSuccess: false, error: 'not following user' };
            }
            const userToUnfollow = await User.findOneBy({ token: userToUnfollowToken });
            if (!userToUnfollow) {
                return { wasSuccess: false, error: 'user does not exist' };
            }
            user.following = user.following.filter((u) => u.token !== userToUnfollowToken);
            await user.save();
            return { wasSuccess: true };
        } catch (err) {
            return { wasSuccess: false, error: 'unexpected error occurred' };
        }
    }

    @Mutation(() => UserResponse)
    @UseMiddleware(isAuth)
    async updateProfilePic(
        @Arg("newProfilePicUrl") newProfilePicUrl: string,
        @Ctx() { req }: MyContext,
    ): Promise<UserResponse> {
        if (newProfilePicUrl.length > MAX_PROFILE_PIC_URL_LENGTH) {
            return { error: 'profile pic url cannot be more than 250 characters' };
        }

        try {
            const user = await User.findOneBy({ token: req.session.userToken });
            user.profilePicUrl = newProfilePicUrl;
            await user.save();
            return { user };
        } catch (err) {
            return { error: 'unexpected error occurred' };
        }
    }

    @Mutation(() => UserResponse)
    @UseMiddleware(isAuth)
    async updateBio(
        @Arg("newBio") newBio: string,
        @Ctx() { req }: MyContext,
    ): Promise<UserResponse> {
        if (newBio.length > MAX_BIO_LENGTH) {
            return { error: 'bio cannot be more than 250 characters' };
        }

        try {
            const user = await User.findOneBy({ token: req.session.userToken });
            user.bio = newBio;
            await user.save();
            return { user };
        } catch (err) {
            return { error: 'unexpected error occurred' };
        }
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async updateRecoveryEmail(
        @Arg("newEmail") newEmail: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        try {
            const user = await User.findOneBy({ token: req.session.userToken });
            if (!user) throw new Error(`could not find user with token ${req.session.userToken}`);
            user.recoveryEmail = newEmail;
            await user.save();
            return { wasSuccess: true };
        } catch (err) {
            console.log(err.message);
            return { wasSuccess: false, error: 'unexpected error' };
        }
    }

    @Mutation(() => OperationResultResponse)
    async requestPasswordReset(
        @Arg("username") username: string,
        @Ctx() { redis }: MyContext,
    ): Promise<OperationResultResponse> {
        try {
            const user: User = await User.findOneBy({ username });
            if (!user) {
                return { wasSuccess: false, error: `no user with username ${username}` };
            } else if (!user.recoveryEmail) {
                return { wasSuccess: false, error: 'user does not have a recovery email' };
            } else {
                const oneTimeCode: string = v4();
                await redis.set(
                    ONE_TIME_CODE_PREFIX + oneTimeCode,
                    user.token,
                    "EX",
                    ONE_DAY_IN_SECONDS,
                );
                const sendEmailResult = await sendOneTimeCode(oneTimeCode, user.recoveryEmail);
                if (sendEmailResult.wasSuccess) {
                    return sendEmailResult;
                } else {
                    console.log(sendEmailResult.error);
                    sendEmailResult.error = 'send email failed';
                    return sendEmailResult;
                }
            }
        } catch (err) {
            console.log(err.message);
            return { wasSuccess: false, error: 'unexpected error' };
        }
    }

    @Mutation(() => OperationResultResponse)
    async resetPassword(
        @Arg("oneTimeCode") oneTimeCode: string,
        @Arg("username") username: string,
        @Arg("newPassword") newPassword: string,
        @Arg("confirmPassword") confirmPassword: string,
        @Ctx() { redis }: MyContext,
    ): Promise<OperationResultResponse> {
        if (newPassword !== confirmPassword) {
            return { wasSuccess: false, error: 'confirm password does not match password' };
        } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return { wasSuccess: false, error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` };
        }
        try {
            const oneTimeCodeUserToken: string = await redis.get(ONE_TIME_CODE_PREFIX + oneTimeCode);
            const user: User = await User.findOneBy({ username });
            if (!user || user.token !== oneTimeCodeUserToken) {
                return { wasSuccess: false, error: 'one-time code or username is invalid' };
            }
            user.password = await argon2.hash(newPassword);
            await user.save();
            await redis.del(ONE_TIME_CODE_PREFIX + oneTimeCode);
            return { wasSuccess: true };
        } catch (err) {
            console.log(err.message);
            return { wasSuccess: false, error: 'unexpected error' };
        }
    }
}

const MIN_PASSWORD_LENGTH = 6;
const MAX_BIO_LENGTH = 250;
const MAX_PROFILE_PIC_URL_LENGTH = 250;
