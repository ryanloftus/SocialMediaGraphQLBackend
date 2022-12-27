import { Query, Resolver, ObjectType, Field, Mutation, Arg } from 'type-graphql'
import User from '../entities/user.js'
import FieldError from './field-error.js'
import AppDataSource from "../data-source.js";

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => User, { nullable: true })
    user?: User
}

@Resolver()
export default class UserResolver {
    @Mutation(() => User)
    async createUser(
        @Arg("username") username: string,
        @Arg("password") password: string,
    ) {
        let user: User
        
        try {
            // TODO: hash the password
            user = await User.create({ username: username, password: password }).save()
        } catch (error) {
            // TODO: use field errors to provide specific error messsages
            return error
        }

        return user
    }

    @Query(() => String)
    getUser() {
        return "get user called"
    }

    @Mutation(() => String)
    updateUser() {
        return "update user called"
    }

    @Mutation(() => String)
    deleteUser() {
        return "delete user called"
    }
}
