import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Razorpay from 'https://esm.sh/razorpay@2';
Deno.serve(async (req)=>{
  console.log('Received request:', req.method, req.url);
  const supabase = createClient(Deno.env.get('SUPABASE_URL') || 'missing-url', Deno.env.get('SUPABASE_KEY') || 'missing-key');
  const razorpay = new Razorpay({
    key_id: Deno.env.get('RAZORPAY_KEY_ID') || 'missing-key-id',
    key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') || 'missing-key-secret'
  });
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  try {
    const body = await req.json();
    console.log('Request body:', body);
    const { amount, currency, sellerId } = body;
    if (!amount || !currency || !sellerId) {
      console.error('Missing fields:', {
        amount,
        currency,
        sellerId
      });
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    console.log('Creating Razorpay order with:', {
      amount,
      currency,
      receipt: `receipt_${sellerId}_${Date.now()}`
    });
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${sellerId}_${Date.now()}`,
      notes: {
        sellerId
      }
    });
    console.log('Razorpay order created:', order);
    console.log('Inserting into Supabase razorpay_orders:', {
      razorpay_order_id: order.id,
      seller_id: sellerId,
      amount: amount / 100,
      currency,
      status: 'created'
    });
    const { error } = await supabase.from('razorpay_orders').insert({
      razorpay_order_id: order.id,
      seller_id: sellerId,
      amount: amount / 100,
      currency,
      status: 'created'
    });
    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to store order details',
        details: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    console.log('Order successfully created:', order.id);
    return new Response(JSON.stringify({
      order_id: order.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create Razorpay order',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
