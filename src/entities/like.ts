import { ObjectType, Field } from "type-graphql";
import { Entity, BaseEntity, ManyToOne, Relation } from "typeorm";
import User from "./user.js";
import Post from "./post.js";

@ObjectType()
@Entity()
export default class Like extends BaseEntity {
    
    @Field(() => Post)
    @ManyToOne(() => Post)
    post!: Relation<Post>;

    @Field(() => User)
    @ManyToOne(() => User)
    user!: Relation<User>
}
