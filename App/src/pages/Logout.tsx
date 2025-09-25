import React from 'react'
import { useNavigate } from 'react-router-dom'

function Logout() {
    const navigate = useNavigate();
    return (
        <div>
            <h1>
                you are logout !
            </h1>
            <button onClick={() => navigate('/')}>Redirect to login </button>
        </div>
    )
}

export default Logout