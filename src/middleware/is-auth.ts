import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types/my-context";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
    if (!context.req.session.userToken) {
        throw new Error("not authenticated");
    }

    return next();
}