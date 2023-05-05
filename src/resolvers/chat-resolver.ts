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
            const chat: Chat = await Chat.findOne({
                where: { id: chatId },
                relations: {
                    members: true,
                    messages: true,
                },
            });
            if (!chat || !chat.members?.find((m) => m.token === userToken)) {
                return { error: 'chat could not be found' };
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
        const senderToken = req.session.userToken;
        try {
            const chat: Chat = await Chat.findOne({
                where: { id: chatId },
                relations: { members: true },
            });
            if (!chat || !chat.members?.find((m) => m.token === senderToken)) {
                return { error: 'chat could not be found' };
            } else {
                const sender: User = await User.findOneBy({ token: senderToken });
                if (!sender) throw new Error(`could not find user with token: ${senderToken}`);
                const message: Message = Message.create<Message>({ text, sender, chat });
                await message.save();
                return { message };
            }
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error occurred' };
        }
    }

    @Mutation(() => ChatResponse)
    @UseMiddleware(isAuth)
    async addMemberToChat(
        @Arg("newMemberUserTokens", () => [String]) newMemberUserTokens: string[],
        @Arg("chatId") chatId: string,
        @Ctx() { req }: MyContext,
    ): Promise<ChatResponse> {
        const userToken = req.session.userToken;
        try {
            const chat: Chat = await Chat.findOne({
                where: { id: chatId },
                relations: { members: true },
            });
            if (!chat || !chat.members?.find((m) => m.token === userToken)) {
                return { error: 'could not find chat' };
            }
            const newMembers: User[] = await Promise.all(newMemberUserTokens.map((token) => User.findOneBy({ token })));
            if (newMembers.find((m) => !m)) {
                return { error: 'not all users specified could be found' };
            }
            chat.members = chat.members.concat(newMembers);
            await chat.save();
            return { chat };
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error occurred' };
        }
    }
}
