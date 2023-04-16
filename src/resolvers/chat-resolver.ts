import { Query, Resolver, ObjectType, Field, Mutation, Arg } from 'type-graphql';
import FieldError from '../utils/field-error';
import Chat from '../entities/chat.js';

@ObjectType()
class ChatResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]

    @Field(() => Chat, { nullable: true })
    chat?: Chat
}

@Resolver()
export default class ChatResolver {

}
