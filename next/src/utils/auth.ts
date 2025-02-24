import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase"; // Firebase を初期化したファイルからインポート
import { toast } from "react-hot-toast";
import { apiRoot } from "../utils/foundation";

// Googleでログインする関数
const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        // Googleアカウントを使用してログイン
        const result = await signInWithPopup(auth, provider);
        // Googleユーザー情報を取得
        const user = result.user;
        try {
            const response = await fetch(apiRoot+"/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                }),
            });
        
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to create user:", errorData);
            } else {
                console.log("User created successfully");
            }
        } catch (error) {
            console.error("Error occurred while creating user:", error);
        }
        
        console.log("Logged in as ", user.displayName, user.email, user.uid);
        toast.success("Logged in as " + user.displayName);
    } catch (error) {
        console.error("Error logging in with Google:", error);
        toast.error("Failed to log in with Google");
    }
};

export default signInWithGoogle;

// サインアウトする関数
export const signOutUser = async () => {
    try {
        await signOut(auth);
        console.log("User signed out");
        toast.success("Signed out successfully");
    } catch (error) {
        console.error("Error signing out:", error);
        toast.error("Failed to sign out");
    }
};