import { ObjectType, Field } from "type-graphql";
import { Entity, BaseEntity, ManyToOne, Relation, PrimaryGeneratedColumn, Column } from "typeorm";
import User from "./user.js";
import Post from "./post.js";

@ObjectType()
@Entity()
export default class Comment extends BaseEntity {

    @Field(() => String)
    @PrimaryGeneratedColumn()
    id!: string

    @Field(() => String)
    @Column()
    text!: string

    @Field(() => Post)
    @ManyToOne(() => Post)
    post!: Relation<Post>;

    @Field(() => User)
    @ManyToOne(() => User)
    author!: Relation<User>
}
