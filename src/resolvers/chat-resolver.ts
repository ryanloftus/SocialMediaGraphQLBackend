import { Query, Resolver, ObjectType, Field, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import Chat from '../entities/chat.js';
import Message from '../entities/message.js';
import OperationResultResponse from '../utils/operation-result';
import { MyContext } from '../types/my-context';
import { isAuth } from '../middleware/is-auth.js';
import User from '../entities/user.js';

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
    @UseMiddleware(isAuth)
    async createChat(
        @Arg("memberUserTokens", () => [String]) members: string[],
        @Ctx() { req }: MyContext,  
    ): Promise<ChatResponse> {
        const userToken = req.session.userToken;
        if (!members.find((m) => m === userToken)) {
            members.push(userToken);
        }

        if (members.length < 2) {
            return { error: 'chat must have more than one participant' };
        }

        try {
            let chat: Chat = new Chat();
            chat.members = await Promise.all(members.map((m) => User.findOneBy({ token: m })));
            chat = Chat.create(chat);
            await chat.save();
            return { chat };
        } catch (err) {
            return { error: 'could not create chat' };
        }
    }

    @Query(() => ChatResponse)
    @UseMiddleware(isAuth)
    async getChat(
        @Arg("chatId") chatId: string,
        @Ctx() { req }: MyContext,
    ): Promise<ChatResponse> {
        const userToken = req.session.userToken;
        try {
            const chat: Chat = await Chat.findOneBy({ id: chatId });
            if (!chat) {
                return { error: 'no such chat could be found' };
            } else if (!chat.members?.find((m) => m.token === userToken)) {
                return { error: 'user is not a member of this chat' };
            } else {
                return { chat };
            }
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error occurred' };
        }
    }

    @Mutation(() => MessageResponse)
    @UseMiddleware(isAuth)
    async sendMessage(
        @Arg("chatId") chatId: string,
        @Arg("text") text: string,
        @Ctx() { req }: MyContext
    ): Promise<MessageResponse> {
        const sender = req.session.userToken;

        try {
            const chat: Chat = await Chat.findOneBy({ id: chatId });
            if (chat === null) {
                return { error: 'no such chat could be found' };
            } else if (!chat.members?.find((m) => m.token === sender)) {
                return { error: 'user is not a member of this chat' };
            } else {
                let message = new Message();
                message.text = text;
                message.sender = await User.findOneBy({ token: sender });
                message.chat = chat;
                message = Message.create(message);
                await message.save();
                return { message };
            }
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error occurred' };
        }
    }
}
