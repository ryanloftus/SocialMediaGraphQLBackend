import { Query, Resolver, ObjectType, Field, Mutation, Arg, Ctx } from 'type-graphql';
import Chat from '../entities/chat.js';
import Message from '../entities/message';
import OperationResultResponse from '../utils/operation-result';
import { MyContext } from '../types/my-context';

@ObjectType()
class ChatResponse {
    @Field(() => String, { nullable: true })
    error?: string

    @Field(() => Chat, { nullable: true })
    chat?: Chat
}

@ObjectType()
class MessageResponse {
    @Field(() => String, { nullable: true })
    error?: string

    @Field(() => Message, { nullable: true })
    message?: Message
}

@Resolver()
export default class ChatResolver {

    @Mutation(() => ChatResponse)
    async createChat(

    ) {

    }

    @Mutation(() => MessageResponse)
    async sendMessage(
        @Arg("chatId") chatId: string,
        @Arg("text") text: string,
        @Ctx() { req }: MyContext
    ) {
        const sender = req.session.userToken;
        let error = null;
        let message;

        try {
            let chat: Chat = await Chat.findOneBy({ id: chatId });
            if (chat === null) {
                error = 'No such chat could be found';
            } else if (chat.members.find((m) => m.token === sender) === undefined) {
                error = 'User is not a member of this chat';
            } else {
                message = new Message();
                message.text = text;
                message.sender = sender;
                message.chat = chatId;
                message = await Message.create(message).save();
            }
        } catch (err) {
            error = 'Unexpected error occurred';
        }

        if (error === null) {
            return { message }
        } else {
            return { error }
        }
    }
}
