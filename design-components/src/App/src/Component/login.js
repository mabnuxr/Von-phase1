import { useState } from "react";
import { useAuth } from "../Hooks/useAuth";

const Login =()=>{
    const [organizationId, setOrganizationId] = useState('');
    const {Login, Loading} = useAuth();

    const HandelSubmit = (e) =>{
        e.preventDefault()
        if (organizationId.trim()) {
            Login(organizationId);
        }
    };

    return(
        <div>
            <h2>Enterprise Login</h2>
            <form onSubmit={HandelSubmit}>
                <div>
                    <label htmlFor="orgID"></label>
                    <input
                    id="orgID"
                    value={organizationId}
                    placeholder="Enter your organizatio id"
                    onChange={(e)=>setOrganizationId(e.target.value)}
                    />
                </div>
                <button type="Sumbit" >
                    {Loading? 'Loading...' : 'Loginn with SSO'}
                </button>
            </form>
        </div>
    )
};
export default Login;