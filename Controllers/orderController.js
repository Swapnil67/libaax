const Razorpay = require('razorpay');
const request = require('request');
const dotenv = require('dotenv');
const User = require('../models/userModel');
var crypto = require('crypto');
const Order = require('../models/orderModel');

dotenv.config({
  path: './config.env',
});

const instance = new Razorpay({
  key_id: process.env.RAZOR_PAY_KEY_ID,
  key_secret: process.env.RAZOR_PAY_KEY_SECRET,
});

exports.getOrders = async (req, res, next) => {
  console.log('Get Orders: ', req.body);
  try {
    const options = {
      amount: req.body.total * 100,
      currency: 'INR',
      receipt: 'receipt#1',
      payment_capture: 0,
    };
    instance.orders.create(options, async function (err, order) {
      if (err) {
        // return res.status(500).json({
        //   message: 'Something Went Wrong',
        // });
        console.log(err);
      }
      console.log(order);
      const user = await req.user.populate('cart.items.productId');
      const products = user.cart.items;
      return res.render('payment/successpage', {
        order: order,
        user: req.user,
        pageTitle: 'Payment Page',
        products: products,
      });
    });
  } catch (err) {
    console.log(err);
  }
};

exports.capturePayment = (req, res) => {
  const { orderId, response } = req.body;
  let body = response.razorpay_order_id + '|' + response.razorpay_payment_id;

  var expectedSignature = crypto
    .createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
  console.log('sig received ', response.razorpay_signature);
  console.log('sig generated ', expectedSignature);
  var validResp = { signatureIsValid: 'false' };
  if (expectedSignature === response.razorpay_signature)
    validResp = { signatureIsValid: 'true' };

  if (validResp['signatureIsValid']) {
    req.user
      .populate('cart.items.productId')
      .then(user => {
        const products = user.cart.items.map(i => {
          return { quantity: i.quantity, product: { ...i.productId._doc } };
        });
        const order = new Order({
          user: {
            name: req.user.name,
            email: req.user.email,
            userId: req.user,
          },
          products: products,
          totalAmount: amount,
        });
        return order.save();
      })
      .then(result => {
        return req.user.clearCart();
      });
      
    try {
      return request(
        {
          method: 'POST',
          url: `https://${process.env.RAZOR_PAY_KEY_ID}:${process.env.RAZOR_PAY_KEY_SECRET}@api.razorpay.com/v1/payments/${paymentId}/capture`,
          form: {
            amount: amount,
            currency: 'INR',
          },
        },
        async function (err, response, body) {
          if (err) {
            console.log(err);
          }
          // console.log('Status:', response.statusCode);
          // console.log('Headers:', JSON.stringify(response.headers));
          // console.log('Response:', body);
          return res.status(200).redirect('/my_orders');
        }
      );
    } catch (err) {
      console.log(err);
    }
  }
};

// exports.allPayments = (req, res, next) => {
//   try {
//     return request(
//       {
//         method: 'GET',
//         url: `https://${process.env.RAZOR_PAY_KEY_ID}:${process.env.RAZOR_PAY_KEY_SECRET}@api.razorpay.com/v1/payments/`,
//       },
//       async function (err, response, body) {
//         if (err) {
//           console.log(err);
//         }
//         // console.log('Status:', response.statusCode);
//         // console.log('Headers:', JSON.stringify(response.headers));
//         console.log('Response:', body);
//         return res.status(200).json(body);
//         // return res.status(200).redirect('/home');
//       }
//     );
//   } catch (err) {
//     console.log(err);
//   }
// };
