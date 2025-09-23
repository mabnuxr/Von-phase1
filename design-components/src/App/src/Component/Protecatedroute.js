import React from "react";
import { useNavigate } from "router-dom";
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
        return(
            Naviagtion('/login')
        )
    }

    return children;
};
export default ProtectedRoute;
