import { Query, Resolver, ObjectType, Field, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import OperationResultResponse from '../utils/operation-result.js';
import { MyContext } from '../types/my-context.js';
import { isAuth } from '../middleware/is-auth.js';
import User from '../entities/user.js';
import Post from '../entities/post.js';
import Like from '../entities/like.js';
import Comment from '../entities/comment.js';

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
            const post: Post = Post.create({ content, author, likes: 0 });
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
            const post: Post = await Post.findOne({
                where: { id: postId },
                relations: { 
                    author: true,
                    comments: { author: true },
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
            const existingLike: Like = await Like.findOneBy({ userToken, postId });
            if (existingLike) return { wasSuccess: true };

            await Like.create({ userToken, postId }).save();
            const likes = await Like.countBy({ postId });
            await Post.update({ id: postId }, { likes });
            return { wasSuccess: true };
        } catch (err) {
            console.log(err.message);
            return { wasSuccess: false, error: 'unexpected error' };
        }
    }

    @Mutation(() => OperationResultResponse)
    @UseMiddleware(isAuth)
    async unlikePost(
        @Arg("postId") postId: string,
        @Ctx() { req }: MyContext,
    ): Promise<OperationResultResponse> {
        const userToken = req.session.userToken;
        try {
            const existingLike: Like = await Like.findOneBy({ userToken, postId });
            if (!existingLike) return { wasSuccess: true };

            await Like.delete({ userToken, postId });
            const likes = await Like.countBy({ postId });
            await Post.update({ id: postId }, { likes });
            return { wasSuccess: true };
        } catch (err) {
            console.log(err.message);
            return { wasSuccess: false, error: 'unexpected error' };
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
            return { wasSuccess: false, error: `comment cannot be longer than ${MAX_COMMENT_LENGTH} characters` };
        }
        try {
            const post: Post = await Post.findOneBy({ id: postId });
            if (!post) {
                return { wasSuccess: false, error: 'post not found' };
            }
            const user: User = await User.findOneBy({ token: userToken });
            if (!user) throw new Error(`user with token ${userToken} not found`);
            const comment: Comment = Comment.create({ author: user, post, text: commentText });
            await comment.save();
            return { wasSuccess: true };
        } catch (err) {
            console.log(err.message);
            return { wasSuccess: false, error: 'unexpected error' };
        }
    }
}

const MAX_POST_LENGTH = 250;
const MAX_COMMENT_LENGTH = 250;
