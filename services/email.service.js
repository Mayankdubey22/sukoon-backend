const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Sukoon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Sukoon Email Verification OTP',
    text: `Your Sukoon verification OTP is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="
        margin: 0;
        padding: 40px 20px;
        background-color: #05070b;
        font-family: Arial, sans-serif;
        color: #ffffff;
      ">
        <div style="
          max-width: 500px;
          margin: auto;
          padding: 30px;
          background-color: #11151d;
          border-radius: 16px;
          border: 1px solid #252a33;
          text-align: center;
        ">
          <h1 style="
            margin-bottom: 10px;
            color: #ffffff;
          ">
            Suk<span style="color: #e5092f;">oon</span>
          </h1>

          <h2 style="
            color: #ffffff;
            margin-bottom: 10px;
          ">
            Verify your email
          </h2>

          <p style="
            color: #a1a1aa;
            font-size: 15px;
            line-height: 1.6;
          ">
            Use the OTP below to verify your Sukoon account.
          </p>

          <div style="
            margin: 25px 0;
            padding: 18px;
            background-color: #05070b;
            border: 1px solid #e5092f;
            border-radius: 12px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #ff1744;
          ">
            ${otp}
          </div>

          <p style="
            color: #a1a1aa;
            font-size: 14px;
          ">
            This OTP will expire in 10 minutes.
          </p>

          <p style="
            margin-top: 25px;
            color: #666a73;
            font-size: 12px;
          ">
            If you did not create a Sukoon account, you can ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail,
};