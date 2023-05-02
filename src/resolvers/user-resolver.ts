import { Query, Resolver, ObjectType, Field, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql'
import argon2 from 'argon2'
import User from '../entities/user.js'
import OperationResultResponse from '../utils/operation-result.js'
import { MyContext } from '../types/my-context.js'
import { COOKIE_NAME } from '../utils/constants.js'
import { isAuth } from '../middleware/is-auth.js'

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
            return { error: `password must be at least ${MIN_PASSWORD_LENGTH} characters long` }
        } else if (password !== confirmPassword) {
            return { error: 'confirm password does not match password' }
        }

        try {
            const hashedPassword = await argon2.hash(password)
            const user = await User.create({ username: username, password: hashedPassword }).save()
            req.session.userToken = user.token;
            return { user }
        } catch (error) {
            return { error: "username already exists" }
        }
    }

    @Query(() => UserResponse)
    async getUser(
        @Arg("userToken") userToken: string,
    ): Promise<UserResponse> {
        let user: User

        try {
            user = await User.findOne({ where: { token: userToken } })
        } catch (error) {
            return { error: 'No such user' }
        }

        return { user }
    }

    @Mutation(() => OperationResultResponse)
    async changePassword(
        @Arg("oldPassword") oldPassword: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        const userToken = req.session.userToken;
        let error: string = null
        let user: User = null

        try {
            user = await User.findOne({ where: { token: userToken } })
            if (!user) throw new Error()
            
            const hashedOldPassword = await argon2.hash(oldPassword)
            if (user.password !== hashedOldPassword) {
                error = "password entered is incorrect"
            } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
                error = `new password must be at least ${MIN_PASSWORD_LENGTH} characters long`
            } else {
                const hashedPassword = await argon2.hash(newPassword)
                await User.update({ token: userToken }, { password: hashedPassword })
            }
        } catch {
            error = `user with token ${userToken} does not exist`
        }

        if (!error) {
            return { didOperationSucceed: true }
        } else {
            return { didOperationSucceed: false, error }
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
                didOperationSucceed: false,
                error: `user with token ${userToken} does not exist`,
            };
        }

        return { didOperationSucceed: true };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("username") username: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext,
    ): Promise<UserResponse> {
        const user = await User.findOneBy({ username: username });
        const valid = user && await argon2.verify(user.password, password);
        if (valid) {
            req.session.userToken = user.token;
            return { user };
        } else {
            return { error: 'username or password is incorrect' };
        }
    }

    @Mutation(() => OperationResultResponse)
    async logout(
        @Ctx() { req, res }: MyContext,
    ): Promise<OperationResultResponse> {
        return new Promise((resolve) => {
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) resolve({ didOperationSucceed: false, error: 'failed to end session' });
                else resolve({ didOperationSucceed: true });
            });
        })
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async follow(
        @Arg("userToFollow") userToFollowToken: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        let user: User = null;
        let userToFollow: User = null;
        
        try {
            user = await User.findOneBy({ token: req.session.userToken });
        } catch (err) {
            return { didOperationSucceed: false, error: 'invalid login session' };
        }

        if (user.following.find((u) => u.token === userToFollowToken)) {
            return { didOperationSucceed: false, error: 'already following user' };
        }

        try {
            userToFollow = await User.findOneBy({ token: userToFollowToken });
            if (!userToFollow) throw new Error();
        } catch (err) {
            return { didOperationSucceed: false, error: 'invalid user token' };
        }

        try {
            user.following.push(userToFollow);
            await user.save();
        } catch (err) {
            return { didOperationSucceed: false, error: 'unexpected error' };
        }

        return { didOperationSucceed: true };
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async unfollow(
        @Arg("userToUnfollow") userToUnfollowToken: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        let user: User = null;

        try {
            user = await User.findOneBy({ token: req.session.userToken });
        } catch (err) {
            return { didOperationSucceed: false, error: 'invalid login session' };
        }

        if (!user.following.find((u) => u.token === userToUnfollowToken)) {
            return { didOperationSucceed: false, error: 'not following user' };
        }

        try {
            const userToUnfollow = await User.findOneBy({ token: userToUnfollowToken });
            if (!userToUnfollow) throw new Error();
        } catch (err) {
            return { didOperationSucceed: false, error: 'invalid user token' };
        }

        try {
            user.following = user.following.filter((u) => u.token !== userToUnfollowToken);
            await user.save();
        } catch (err) {
            return { didOperationSucceed: false, error: 'unexpected error' };
        }

        return { didOperationSucceed: true };
    }

    @Mutation(() => UserResponse)
    @UseMiddleware(isAuth)
    async updateProfilePic(
        @Arg("newProfilePicUrl") newProfilePicUrl: string,
        @Ctx() { req }: MyContext,
    ): Promise<UserResponse> {
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
        try {
            const user = await User.findOneBy({ token: req.session.userToken });
            user.bio = newBio;
            await user.save();
            return { user };
        } catch (err) {
            return { error: 'unexpected error occurred' };
        }
    }
}

const MIN_PASSWORD_LENGTH = 6
