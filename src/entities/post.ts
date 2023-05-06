import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, Relation, ManyToOne, CreateDateColumn, OneToMany } from "typeorm";
import User from "./user.js";
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

    @Field(() => User)
    @ManyToOne(() => User, (user: User) => user.posts)
    author!: Relation<User>

    @Field(() => Number)
    @Column({ type: 'integer' })
    likes!: Number

    @Field(() => [Comment])
    @OneToMany(() => Comment, (comment: Comment) => comment.post)
    comments!: Relation<Comment[]>
}