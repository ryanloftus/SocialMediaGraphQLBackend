import { ObjectType, Field } from "type-graphql";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    ManyToMany,
    JoinTable,
} from "typeorm";
import Chat from "./chat.js";

@ObjectType()
@Entity()
export default class User extends BaseEntity {

    @Field(() => String)
    @PrimaryGeneratedColumn()
    token!: string

    @Field()
    @Column({ unique: true })
    username!: string

    @Column()
    password!: string

    @Field(() => [User], { nullable: true })
    @ManyToMany(() => User, (user) => user.following)
    followers?: User[]

    @Field(() => [User], { nullable: true })
    @ManyToMany(() => User, (user) => user.followers)
    @JoinTable()
    following?: User[]

    @Field(() => String, { nullable: true })
    @Column({ type: String, nullable: true })
    profilePicUrl?: string

    @Field(() => String, { nullable: true })
    @Column({ type: String, nullable: true })
    bio?: string

    @Field(() => [Chat], { nullable: true })
    @ManyToMany(() => Chat, (chat) => chat.members)
    chats?: Chat[]
}
