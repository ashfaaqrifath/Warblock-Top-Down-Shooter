

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// --- Supabase Setup ---
const SUPABASE_URL = "https://rnkjnwgkbntinkhgrbpm.supabase.co"
const SUPABASE_KEY = "sb_publishable_mSMt53nucVEn5liO4sZuSQ_Xm_sX4Nz"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Switch Forms ---
window.show = function(id){
document.querySelectorAll('.card').forEach(card=>{
    card.classList.remove('active')
})
document.getElementById(id).classList.add('active')
}

// --- Register ---
window.register = async function(){
const email = document.getElementById("register-email").value
const password = document.getElementById("register-password").value
const username = document.getElementById("register-username").value

// Try signup (ignore "already registered" error)
const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.href }
})

if(signUpError && !signUpError.message.includes("already registered")){
    alert("Error: " + signUpError.message)
    return
}

// Check if user exists in leaderboard
const { data: existing } = await supabase
    .from('leaderboard')
    .select('id')
    .eq('email', email)
    .single()

if(existing){
    // Update username if needed
    const { error: updateError } = await supabase
    .from('leaderboard')
    .update({ username })
    .eq('email', email)

    if(updateError){
    alert("Error updating leaderboard: " + updateError.message)
    return
    }
}else{
    // Insert new row
    const { error: insertError } = await supabase
    .from('leaderboard')
    .insert([{ email, username }])

    if(insertError){
    alert("Error saving to leaderboard: " + insertError.message)
    return
    }
}

alert("Registered. You can login now.")
show('login')
}

// --- Login ---
window.login = async function(){
const email = document.getElementById("login-email").value
const password = document.getElementById("login-password").value

const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
})

if(error){
    alert("Login failed: " + error.message)
    return
}

// Get username from leaderboard
const { data: userData, error: dbError } = await supabase
    .from('leaderboard')
    .select('username')
    .eq('email', email)
    .single()

const username = dbError ? "" : userData.username
window.location.href = "warblock.html";
}

