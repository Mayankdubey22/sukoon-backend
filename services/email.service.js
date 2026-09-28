const { Resend } = require('resend');

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const sendOtpEmail = async (
  email,
  otp
) => {
  try {
    const { data, error } =
      await resend.emails.send({
        from:
          'Sukoon <onboarding@resend.dev>',

        to: [email],

        subject:
          'Your Sukoon Email Verification OTP',

        html: `
          <div
            style="
              margin: 0;
              padding: 40px 20px;
              background-color: #08090c;
              font-family: Arial, Helvetica, sans-serif;
              color: #ffffff;
            "
          >
            <div
              style="
                max-width: 520px;
                margin: 0 auto;
                background-color: #111317;
                border: 1px solid #252832;
                border-radius: 20px;
                padding: 36px 28px;
                text-align: center;
              "
            >

              <!-- Logo -->

              <div
                style="
                  width: 64px;
                  height: 64px;
                  margin: 0 auto 20px;
                  border-radius: 18px;
                  background-color: #1c1115;
                  border: 1px solid #5c1825;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                <span
                  style="
                    color: #ff1744;
                    font-size: 28px;
                    font-weight: bold;
                  "
                >
                  ♪
                </span>
              </div>

              <!-- Heading -->

              <h1
                style="
                  margin: 0;
                  color: #ffffff;
                  font-size: 28px;
                  line-height: 1.3;
                "
              >
                Welcome to Sukoon
              </h1>

              <p
                style="
                  margin: 12px 0 0;
                  color: #a1a1aa;
                  font-size: 15px;
                  line-height: 1.6;
                "
              >
                Verify your email to continue
                creating your account.
              </p>

              <!-- OTP -->

              <div
                style="
                  margin: 30px auto;
                  padding: 20px;
                  border-radius: 16px;
                  background-color: #1b1d21;
                  border: 1px solid #2b2e36;
                "
              >
                <p
                  style="
                    margin: 0 0 10px;
                    color: #777b85;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                  "
                >
                  Verification Code
                </p>

                <div
                  style="
                    color: #ff1744;
                    font-size: 36px;
                    font-weight: bold;
                    letter-spacing: 10px;
                  "
                >
                  ${otp}
                </div>
              </div>

              <!-- Expiry -->

              <p
                style="
                  margin: 0;
                  color: #a1a1aa;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                This verification code will
                expire in
                <strong
                  style="color: #ffffff;"
                >
                  10 minutes
                </strong>.
              </p>

              <p
                style="
                  margin: 24px 0 0;
                  color: #666a73;
                  font-size: 12px;
                  line-height: 1.6;
                "
              >
                If you didn't request this
                verification code, you can
                safely ignore this email.
              </p>

              <!-- Footer -->

              <div
                style="
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #252832;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #555861;
                    font-size: 11px;
                  "
                >
                  © Sukoon — Your personal
                  music space
                </p>
              </div>

            </div>
          </div>
        `,
      });

    if (error) {
      console.error(
        'Resend email error:',
        error
      );

      throw new Error(
        error.message ||
          'Failed to send verification email.'
      );
    }

    console.log(
      `OTP email sent successfully to ${email}`,
      data?.id
        ? `(id: ${data.id})`
        : ''
    );

    return data;
  } catch (error) {
    console.error(
      'Email service error:',
      error
    );

    throw error;
  }
};

module.exports = {
  sendOtpEmail,
};