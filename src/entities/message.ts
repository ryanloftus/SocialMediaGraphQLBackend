import { ObjectType, Field } from "type-graphql";
import { Entity, Column, BaseEntity, CreateDateColumn } from "typeorm";
import User from "./user.js";

@ObjectType()
@Entity()
export default class Message extends BaseEntity {

    @Field(() => String)
    @Column()
    text!: String;

    @Field(() => User)
    @Column()
    to!: User

    @Field(() => User)
    @Column()
    from!: User

    @Field(() => String)
    @CreateDateColumn()
    timestamp!: Date;
}
