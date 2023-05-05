import nodemailer from "nodemailer";
import OperationResultResponse from "./operation-result";

const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PW,
    },
});

export default async function sendOneTimeCode(oneTimeCode: string, to: string): Promise<OperationResultResponse> {
    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject: 'social-media One-Time Code',
        html: `<p>Your one-time code is <b>${oneTimeCode}</b></p>`,
    };
    return new Promise<OperationResultResponse>((resolve) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                resolve({ didOperationSucceed: false, error: error.message });
            } else {
                console.log('Email sent: ' + info.response);
                resolve({ didOperationSucceed: true });
            }
        });
    });
}
