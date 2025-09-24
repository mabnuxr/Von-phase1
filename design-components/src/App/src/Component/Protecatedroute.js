import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";

const ProtectedRoute =({children})=>{
    const {User, Loading} = useAuth();
    const Naviagtion = useNavigate();
    if (Loading) {
        return(
            <div>Loading...</div>
        )
    }
    if(!User){
        Naviagtion('/login');
        return null;
    }

    return children;
};
export default ProtectedRoute;
