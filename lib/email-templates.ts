const EMAIL_HEADER = `
  <tr>
    <td align="center" bgcolor="#111827" style="padding: 50px 0;">
      <h1 style="color: #45cd55; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase;">ŠIPKOVIŠTĚ.CZ</h1>
      <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 13px; opacity: 0.7; letter-spacing: 1px;">TRŽIŠTĚ PRO KAŽDÉHO ŠIPKAŘE</p>
    </td>
  </tr>
`

const EMAIL_FOOTER = `
  <tr>
    <td bgcolor="#f9fafb" style="padding: 30px; border-top: 1px solid #f3f4f6; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">Odesláno z <strong>www.sipkoviste.cz</strong></p>
    </td>
  </tr>
`

function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f8f9fa;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding: 20px 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          ${EMAIL_HEADER}
          <tr>
            <td style="padding: 50px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${content}
              </table>
            </td>
          </tr>
          ${EMAIL_FOOTER}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function getBuyIntentEmailHtml(sellerName: string, productName: string, chatUrl: string): string {
  const content = `
    <tr>
      <td style="color: #111827; font-size: 26px; font-weight: 800; text-align: center; padding-bottom: 20px;">Někdo koupil! 🎯</td>
    </tr>
    <tr>
      <td style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; padding-bottom: 20px;">Ahoj ${sellerName}, máme dobrou zprávu – někdo koupil váš inzerát <strong>${productName}</strong>.</td>
    </tr>
    <tr>
      <td style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; padding-bottom: 40px;">Domluvte si podrobnosti v chatu.</td>
    </tr>
    <tr>
      <td align="center">
        <a href="${chatUrl}" style="background-color: #45cd55; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 16px; display: inline-block; border-bottom: 3px solid #36a344; text-transform: uppercase; letter-spacing: 1px;">Otevřít chat</a>
      </td>
    </tr>
  `
  return wrapEmail(content)
}

export function getOfferEmailHtml(sellerName: string, productName: string, formattedAmount: string, chatUrl: string): string {
  const content = `
    <tr>
      <td style="color: #111827; font-size: 26px; font-weight: 800; text-align: center; padding-bottom: 20px;">Nová nabídka! 💰</td>
    </tr>
    <tr>
      <td style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; padding-bottom: 20px;">Ahoj ${sellerName}, někdo nabízí <strong>${formattedAmount} Kč</strong> za váš inzerát <strong>${productName}</strong>.</td>
    </tr>
    <tr>
      <td style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; padding-bottom: 40px;">Zobrazte nabídku a odpovězte v chatu.</td>
    </tr>
    <tr>
      <td align="center">
        <a href="${chatUrl}" style="background-color: #45cd55; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 16px; display: inline-block; border-bottom: 3px solid #36a344; text-transform: uppercase; letter-spacing: 1px;">Zobrazit nabídku</a>
      </td>
    </tr>
  `
  return wrapEmail(content)
}

export function getCounterOfferEmailHtml(buyerName: string, sellerName: string, productName: string, formattedAmount: string, chatUrl: string): string {
  const content = `
    <tr>
      <td style="color: #111827; font-size: 26px; font-weight: 800; text-align: center; padding-bottom: 20px;">Protinabídka! 💰</td>
    </tr>
    <tr>
      <td style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; padding-bottom: 20px;">Ahoj ${buyerName}, prodejce ${sellerName} vám nabízí <strong>${productName}</strong> za <strong>${formattedAmount} Kč</strong>.</td>
    </tr>
    <tr>
      <td style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; padding-bottom: 40px;">Zobrazte nabídku a odpovězte v chatu.</td>
    </tr>
    <tr>
      <td align="center">
        <a href="${chatUrl}" style="background-color: #45cd55; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 16px; display: inline-block; border-bottom: 3px solid #36a344; text-transform: uppercase; letter-spacing: 1px;">Zobrazit nabídku</a>
      </td>
    </tr>
  `
  return wrapEmail(content)
}

export function getOfferAcceptedEmailHtml(productName: string, formattedAmount: string, chatUrl: string): string {
  const content = `
    <tr>
      <td style="color: #111827; font-size: 26px; font-weight: 800; text-align: center; padding-bottom: 20px;">Nabídka přijata! ✅</td>
    </tr>
    <tr>
      <td style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; padding-bottom: 20px;">Prodejce přijímá vaši nabídku <strong>${formattedAmount} Kč</strong> za <strong>${productName}</strong>.</td>
    </tr>
    <tr>
      <td style="color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; padding-bottom: 40px;">Domluvte si podrobnosti předání v chatu.</td>
    </tr>
    <tr>
      <td align="center">
        <a href="${chatUrl}" style="background-color: #45cd55; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 16px; display: inline-block; border-bottom: 3px solid #36a344; text-transform: uppercase; letter-spacing: 1px;">Otevřít chat</a>
      </td>
    </tr>
  `
  return wrapEmail(content)
}
