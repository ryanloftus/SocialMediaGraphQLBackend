import { Query, Resolver, ObjectType, Field, Mutation, Arg } from 'type-graphql'
import User from '../entities/user.js'
import FieldError from '../utils/field-error.js'
import OperationResultResponse from '../utils/operation-result.js'

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User
}

@Resolver()
export default class UserResolver {
    @Mutation(() => UserResponse)
    async createUser(
        @Arg("username") username: string,
        @Arg("password") password: string,
    ) {
        let user: User
        let errors: FieldError[] = Array()

        if (password.length < MIN_PASSWORD_LENGTH) {
            errors.push({ field: "password", message: `password must be at least ${MIN_PASSWORD_LENGTH} characters long`})
        }

        try {
            // TODO: hash the password
            user = await User.create({ username: username, password: password }).save()
        } catch (error) {
            errors.push({ field: "username", message: "username already exists" })
        }

        if (errors.length === 0) {
            return { user }
        } else {
            return { errors }
        }
    }

    @Query(() => UserResponse)
    async getUser(
        @Arg("userToken") userToken: string,
    ) {
        let user: User

        try {
            user = await User.findOne({ where: { token: userToken } })
        } catch (error) {
            return error
        }

        return { user }
    }

    @Mutation(() => OperationResultResponse)
    async changePassword(
        @Arg("userToken") userToken: string,
        @Arg("oldPassword") oldPassword: string,
        @Arg("newPassword") newPassword: string,
        @Arg("confirmPassword") confirmPassword: string,
    ) {
        let errors: FieldError[] = Array()
        let user: User | null

        try {
            user = await User.findOne({ where: { token: userToken } })
            
            if (user?.password !== oldPassword) {
                errors.push({ field: "oldPassword", message: "password entered is incorrect" })
            }

            if (newPassword.length < MIN_PASSWORD_LENGTH) {
                errors.push({ field: "newPassword", message: `new password must be at least ${MIN_PASSWORD_LENGTH} characters long` })
            }

            if (newPassword !== confirmPassword) {
                errors.push({ field: "confirmPassword", message: "new password and confirm password do not match" })
            }

            if (errors.length === 0) {
                await User.update({ token: userToken }, { password: newPassword })
            }
        } catch {
            errors.push({ field: "userToken", message: `user with token ${userToken} does not exist` })
        }

        if (errors.length === 0) {
            return { didOperationSucceed: true }
        } else {
            return { didOperationSucceed: false, errors: errors }
        }
    }

    @Mutation(() => OperationResultResponse)
    async deleteUser(
        @Arg("userToken") userToken: string,
    ) {
        try {
            const user: User = await User.findOne({ where: { token: userToken } })
            await user.remove()
        } catch {
            return {
                didOperationSucceed: false,
                errors: [{ field: "userToken", message: `user with token ${userToken} does not exist`}],
            }
        }
    }
}

const MIN_PASSWORD_LENGTH = 6
