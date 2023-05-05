import { Entity, BaseEntity, PrimaryColumn } from "typeorm";

@Entity()
export default class Like extends BaseEntity {

    @PrimaryColumn()
    postId!: string

    @PrimaryColumn()
    userToken!: string
}
