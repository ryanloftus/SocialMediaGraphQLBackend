# GraphQL Backend for Social Media App

Built using TypeScript, PostgreSQL, Redis, TypeORM, and TypeGraphQL

## Authentication

Cookie authentication is performed using express-session.

## Password Reset

Users can add a recovery email to their account to be used if they forget their password. User's can request a password reset for their username and if a recovery email exists for that user, an email containing a one-time password reset code is sent to the specified recovery email. The one-time code can be used with the user's username to set a new password.

## Features

Users can have a profile picture and bio. Users can follow other users and make posts that will show up in the feeds of followers. Posts are purely textual and have a character limit. A user can like and comment on a post. Finally users can create chats containing one or more other users. Additional members can be added to a chat after creation. Chats allow users to send text-only messages to all members of the chat.
