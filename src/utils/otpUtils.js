import speakeasy from "speakeasy";
import qrcode from "qrcode";

export const generateMFASecret = async (email) => {
    const secret = speakeasy.generateSecret({
        name: `MERNAuthApp (${email})`,
        length: 20,
    });

    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return {
        base32: secret.base32,
        otpauthUrl,
        qrCodeDataUrl,
    };
};

export const verifyMFAToken = (secretBase32, token) => {
    return speakeasy.totp.verify({
        secret: secretBase32,
        encoding: "base32",
        token,
        window: 1, // allow slight time drift
    });
};

// simple 6-digit OTP
export const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();
