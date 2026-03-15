// ============================================================
// LEADERBOARD
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://rnkjnwgkbntinkhgrbpm.supabase.co"
const SUPABASE_KEY = "sb_publishable_mSMt53nucVEn5liO4sZuSQ_Xm_sX4Nz"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function renderLeaderboard(list) {
    const container = document.getElementById('leaderboardList');
    if (!container) return;
    container.innerHTML = '';
    list.sort((a,b) => b.levels - a.levels).forEach((p, i) => {
        const item = document.createElement('div');
        item.className = 'leader-item';
        const posEl = document.createElement('span');
        posEl.className = 'pos';
        posEl.textContent = (i+1) + '.';
        const nameEl = document.createElement('span');
        nameEl.className = 'name';
        nameEl.textContent = p.username;
        const levelsEl = document.createElement('span');
        levelsEl.className = 'levels';
        levelsEl.textContent = p.levels;
        item.appendChild(posEl);
        item.appendChild(nameEl);
        item.appendChild(levelsEl);
        container.appendChild(item);
    });
}

async function loadUsername(){
    try {
        const { data: sessionData } = await supabase.auth.getSession()
        
        if (!sessionData.session) {
            console.warn("No active session");
            return;
        }

        const email = sessionData.session.user.email

        const { data, error } = await supabase
            .from("leaderboard")
            .select("username, levels")
            .eq("email", email)
            .single()

        if(data){
            document.getElementById("usernameDisplay").textContent = data.username
            document.getElementById("highscoreDisplay").textContent = data.levels
        }else{
            document.getElementById("usernameDisplay").textContent = "Username not found"
        }
    } catch (error) {
        console.error("Error loading username:", error)
    }
}

async function saveLevelsToDatabase(levelsReached) {
    try {
        const { data: sessionData } = await supabase.auth.getSession()
        
        if (!sessionData.session) {
            console.warn("No active session");
            return;
        }

        const email = sessionData.session.user.email

        // Get the current user's record
        const { data: existingData, error: fetchError } = await supabase
            .from("leaderboard")
            .select("levels")
            .eq("email", email)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Error fetching user data:", fetchError)
            return
        }

        // Only update if the new levels count is higher than the current one
        const currentLevels = existingData?.levels || 0
        if (levelsReached > currentLevels) {
            const { error: updateError } = await supabase
                .from("leaderboard")
                .update({ levels: levelsReached })
                .eq("email", email)

            if (updateError) {
                console.error("Error updating levels:", updateError)
            } else {
                // Update the UI to show the new highscore
                document.getElementById("highscoreDisplay").textContent = levelsReached
            }
        } else {
            console.log(`Less than highscore (${currentLevels})`)
        }
    } catch (error) {
        console.error("Error in saveLevelsToDatabase:", error)
    }
}

async function loadLeaderboardData() {
    try {
        const { data, error } = await supabase
            .from("leaderboard")
            .select("username, levels")
            .order("levels", { ascending: false })

        if (error) {
            console.error("Error loading leaderboard:", error)
            return
        }

        if (data && data.length > 0) {
            renderLeaderboard(data)
        }
    } catch (err) {
        console.error("Error in loadLeaderboardData:", err)
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabase.auth.signOut()
            window.location.href = "index.html"
        }
    }
}

export {
    loadUsername,
    saveLevelsToDatabase,
    loadLeaderboardData,
    setupLogoutButton
}
