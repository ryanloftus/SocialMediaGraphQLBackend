import { Query, Resolver, ObjectType, Field, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import OperationResultResponse from '../utils/operation-result';
import { MyContext } from '../types/my-context';
import { isAuth } from '../middleware/is-auth.js';
import User from '../entities/user.js';
import Post from '../entities/post';
import Like from '../entities/like';
import Comment from '../entities/comment';

@ObjectType()
class PostResponse {
    @Field(() => String, { nullable: true })
    error?: string

    @Field(() => Post, { nullable: true })
    post?: Post
}

@Resolver()
export default class PostResolver {

    @Mutation(() => PostResponse)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("content") content: string,
        @Ctx() { req }: MyContext,
    ): Promise<PostResponse> {
        if (content.length > MAX_POST_LENGTH) {
            return { error: `post cannot be longer than ${MAX_POST_LENGTH} characters` };
        }
        try {
            const author: User = await User.findOneBy({ token: req.session.userToken });
            if (!author) throw new Error(`could not find user with token ${req.session.userToken}`);
            const post: Post = Post.create({ content, author });
            await post.save();
            return { post };
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error' };
        }
    }

    @Query(() => PostResponse)
    async getPost(
        @Arg("postId") postId: string,
    ): Promise<PostResponse> {
        try {
            const post = await Post.findOne({
                where: { id: postId },
                relations: {
                    author: true,
                    comments: true,
                    likes: true,
                },
            });
            if (!post) {
                return { error: 'post not found' };
            }
            return { post };
        } catch (err) {
            console.log(err.message);
            return { error: 'unexpected error' };
        }
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async likePost(
        @Arg("postId") postId: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        const userToken = req.session.userToken;
        try {
            const post: Post = await Post.findOneBy({ id: postId });
            if (!post) {
                return { didOperationSucceed: false, error: 'post not found' };
            }
            const user: User = await User.findOneBy({ token: userToken });
            if (!user) throw new Error(`user with token ${userToken} not found`);
            const like: Like = Like.create({ user, post });
            await like.save();
            return { didOperationSucceed: true };
        } catch (err) {
            console.log(err.message);
            return { didOperationSucceed: false, error: 'unexpected error' };
        }
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async unlikePost(
        @Arg("postId") postId: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        try {
            const like: Like = await Like.findOneBy({
                user: { token: req.session.userToken },
                post: { id: postId },
            });
            if (!like) return { didOperationSucceed: false, error: 'existing like not found' };
            await like.remove();
            return { didOperationSucceed: true };
        } catch (err) {
            console.log(err.message);
            return { didOperationSucceed: false, error: 'unexpected error' };
        }
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async commentPost(
        @Arg("postId") postId: string,
        @Arg("comment") commentText: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        const userToken = req.session.userToken;
        if (commentText.length > MAX_COMMENT_LENGTH) {
            return { didOperationSucceed: false, error: `comment cannot be longer than ${MAX_COMMENT_LENGTH} characters` };
        }
        try {
            const post: Post = await Post.findOneBy({ id: postId });
            if (!post) {
                return { didOperationSucceed: false, error: 'post not found' };
            }
            const user: User = await User.findOneBy({ token: userToken });
            if (!user) throw new Error(`user with token ${userToken} not found`);
            const comment: Comment = Comment.create({ author: user, post, text: commentText });
            await comment.save();
            return { didOperationSucceed: true };
        } catch (err) {
            console.log(err.message);
            return { didOperationSucceed: false, error: 'unexpected error' };
        }
    }
}

const MAX_POST_LENGTH = 250;
const MAX_COMMENT_LENGTH = 250;
