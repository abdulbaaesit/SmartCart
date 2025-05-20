export function buildOrderConfirmationEmail(
    buyerName: string,
    shipping: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postal: string;
      phone: string;
    },
    items: Array<{
      name: string;
      size?: string | null;
      quantity: number;
      price: number;
    }>,
    newBalance: number
  ) {
    const itemsRows = items.map(it => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">
          ${it.name}${it.size ? ` (${it.size})` : ''}
        </td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">
          ${it.quantity}
        </td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">
          \$${(it.price * it.quantity)}
        </td>
      </tr>
    `).join('')
  
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333">
      <h2 style="text-align:center;color:#0052cc">
        Thank you for your order, ${buyerName}!
      </h2>
      <p>We've received your order and will begin processing it right away. Below is a summary:</p>
      <h3>Shipping Information</h3>
      <p>
        ${shipping.firstName} ${shipping.lastName}<br/>
        ${shipping.address}, ${shipping.city} ${shipping.postal}<br/>
        Phone: ${shipping.phone}
      </p>
      <h3>Order Details</h3>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th align="left" style="padding:8px;border:1px solid #ddd;background:#f5f5f5">
              Item
            </th>
            <th align="center" style="padding:8px;border:1px solid #ddd;background:#f5f5f5">
              Qty
            </th>
            <th align="right" style="padding:8px;border:1px solid #ddd;background:#f5f5f5">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">
              Your new balance:
            </td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">
              \$${newBalance}
            </td>
          </tr>
        </tfoot>
      </table>
      <p style="text-align:center;margin-top:24px">
        <a href="https://yourdomain.com"
           style="background:#0052cc;color:white;padding:12px 24px;
                  border-radius:4px;text-decoration:none">
          Continue Shopping
        </a>
      </p>
      <p style="font-size:12px;color:#888;text-align:center;margin-top:16px">
        If you have any questions, reply to this email or contact support@yourdomain.com.
      </p>
    </div>
    `
  }
  