
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase Setup
const SUPABASE_URL = "https://rnkjnwgkbntinkhgrbpm.supabase.co"
const SUPABASE_KEY = "sb_publishable_mSMt53nucVEn5liO4sZuSQ_Xm_sX4Nz"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)


window.show = function(id){
document.querySelectorAll('.card').forEach(card=>{
    card.classList.remove('active')
})
document.getElementById(id).classList.add('active')
}

// Register
window.register = async function(){
const email = document.getElementById("register-email").value
const password = document.getElementById("register-password").value
const username = document.getElementById("register-username").value

// Check if email already exists
const { data: existingEmail } = await supabase
    .from('leaderboard')
    .select('id')
    .eq('email', email)
    .single()

if(existingEmail){
    alert("Error: Already registered. Please login instead.")
    return
}

// Check if username already exists
const { data: existingUsername } = await supabase
    .from('leaderboard')
    .select('id')
    .eq('username', username)
    .single()

if(existingUsername){
    alert("Error: Username already taken. Pick another name.")
    return
}

// Try signup
const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.href }
})

if(signUpError){
    alert("Error: " + signUpError.message)
    return
}

// Insert new row
const { error: insertError } = await supabase
    .from('leaderboard')
    .insert([{ email, username }])

if(insertError){
    alert("Error saving to leaderboard: " + insertError.message)
    return
}

alert("Registered. You can login now.")
show('login')
}

// Login
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

// Get username from db
const { data: userData, error: dbError } = await supabase
    .from('leaderboard')
    .select('username')
    .eq('email', email)
    .single()

const username = dbError ? "" : userData.username
window.location.href = "warblock.html";
}

