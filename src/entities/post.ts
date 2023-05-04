import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, Relation, ManyToOne, CreateDateColumn, OneToMany } from "typeorm";
import User from "./user.js";
import Like from "./like.js";
import Comment from "./comment.js";

@ObjectType()
@Entity()
export default class Post extends BaseEntity {

    @Field(() => String)
    @PrimaryGeneratedColumn()
    id!: string
    
    @Field(() => String)
    @Column()
    content!: string
    
    @Field(() => String)
    @CreateDateColumn()
    timestamp!: Date

    @Field(() => [User])
    @ManyToOne(() => User, (user: User) => user.posts)
    author?: Relation<User>

    @Field(() => [Like])
    @OneToMany(() => Like, (like: Like) => like.post)
    likes?: Relation<Like[]>

    @Field(() => [Comment])
    @OneToMany(() => Comment, (comment: Comment) => comment.post)
    comments?: Relation<Comment[]>
}