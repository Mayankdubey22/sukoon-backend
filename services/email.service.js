const sendOtpEmail = async (email, otp) => {
  try {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    const fromEmail = process.env.MAILJET_FROM_EMAIL;

    if (!apiKey || !secretKey || !fromEmail) {
      throw new Error(
        'Mailjet environment variables are missing.'
      );
    }

    const credentials = Buffer.from(
      `${apiKey}:${secretKey}`
    ).toString('base64');

    const response = await fetch(
      'https://api.mailjet.com/v3.1/send',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },

        body: JSON.stringify({
          Messages: [
            {
              From: {
                Email: fromEmail,
                Name: 'Sukoon',
              },

              To: [
                {
                  Email: email,
                },
              ],

              Subject:
                'Your Sukoon Email Verification OTP',

              TextPart: `
Your Sukoon verification OTP is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this verification, you can safely ignore this email.
              `.trim(),

              HTMLPart: `
                <div style="
                  margin: 0;
                  padding: 40px 20px;
                  background-color: #05070b;
                  font-family: Arial, Helvetica, sans-serif;
                ">
                  <div style="
                    max-width: 520px;
                    margin: 0 auto;
                    padding: 35px;
                    background-color: #11151d;
                    border: 1px solid #252a33;
                    border-radius: 16px;
                    color: #f5f5f5;
                  ">

                    <div style="
                      text-align: center;
                      margin-bottom: 25px;
                    ">
                      <h1 style="
                        margin: 0;
                        color: #e5092f;
                        font-size: 32px;
                        letter-spacing: 1px;
                      ">
                        Sukoon
                      </h1>

                      <p style="
                        margin-top: 8px;
                        color: #a1a1aa;
                        font-size: 14px;
                      ">
                        Your music. Your space.
                      </p>
                    </div>

                    <h2 style="
                      margin-bottom: 12px;
                      color: #ffffff;
                      font-size: 22px;
                    ">
                      Verify your email
                    </h2>

                    <p style="
                      color: #a1a1aa;
                      font-size: 15px;
                      line-height: 1.6;
                    ">
                      Use the OTP below to verify your email
                      address and complete your Sukoon account setup.
                    </p>

                    <div style="
                      margin: 30px 0;
                      padding: 20px;
                      text-align: center;
                      background-color: #0b0e14;
                      border: 1px solid #8b0015;
                      border-radius: 12px;
                    ">
                      <div style="
                        color: #666a73;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        margin-bottom: 10px;
                      ">
                        Verification Code
                      </div>

                      <div style="
                        color: #ff1744;
                        font-size: 36px;
                        font-weight: bold;
                        letter-spacing: 10px;
                      ">
                        ${otp}
                      </div>
                    </div>

                    <p style="
                      color: #666a73;
                      font-size: 13px;
                      line-height: 1.5;
                    ">
                      This OTP will expire in 10 minutes.
                      If you did not request this verification,
                      you can safely ignore this email.
                    </p>

                    <div style="
                      margin-top: 30px;
                      padding-top: 20px;
                      border-top: 1px solid #252a33;
                      text-align: center;
                    ">
                      <p style="
                        margin: 0;
                        color: #666a73;
                        font-size: 12px;
                      ">
                        © ${new Date().getFullYear()} Sukoon
                      </p>
                    </div>

                  </div>
                </div>
              `,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        'Mailjet API error:',
        data
      );

      throw new Error(
        data?.ErrorMessage ||
        data?.ErrorInfo ||
        'Failed to send email through Mailjet.'
      );
    }

    console.log(
      `OTP email sent successfully to ${email}`
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