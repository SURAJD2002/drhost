// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://arrettgksxgdajacsmbe.supabase.co'; // Replace with your Supabase Project URL
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmV0dGdrc3hnZGFqYWNzbWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE4NDksImV4cCI6MjA1NjAzNzg0OX0.oKRNKtzFES3xign-jHMDkrmoDwJhD3DXTH3T6W5L8AQ'; // Replace with your Supabase Anon Key

// export const supabase = createClient(supabaseUrl, supabaseKey);


// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://ftaefpluizgfwviottma.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YWVmcGx1aXpnZnd2aW90dG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzI0OTksImV4cCI6MjA1NTY0ODQ5OX0.PNs2ooNagTX3IrQc7URneG44yWfzW1c9QdhyiwB0V04'; // From Project Settings > API

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true,
//   },
//   headers: {
//     'Accept': 'application/json', // Explicitly set Accept header
//   },
// });



// // import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://arrettgksxgdajacsmbe.supabase.co'; // Replace with your Supabase Project URL
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmV0dGdrc3hnZGFqYWNzbWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE4NDksImV4cCI6MjA1NjAzNzg0OX0.oKRNKtzFES3xign-jHMDkrmoDwJhD3DXTH3T6W5L8AQ'; // Replace with your Supabase Anon Key

// // export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
// //   auth: {
// //     autoRefreshToken: true,
// //     persistSession: true,
// //     detectSessionInUrl: true,
// //   },
// //   headers: {
// //     'Accept': 'application/json', // Explicitly set Accept header
// //   },
// // });





import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arrettgksxgdajacsmbe.supabase.co'; // Replace with your Supabase Project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycmV0dGdrc3hnZGFqYWNzbWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE4NDksImV4cCI6MjA1NjAzNzg0OX0.oKRNKtzFES3xign-jHMDkrmoDwJhD3DXTH3T6W5L8AQ'; // Replace with your Supabase Anon Key

export const supabase = createClient(supabaseUrl, supabaseKey, {
  autoRefreshToken: true, // Automatically refresh the token when it expires
  persistSession: true,   // Persist the session across page reloads
  detectSessionInUrl: true, // Handle the session from the URL (e.g., after OAuth)
});