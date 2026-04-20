
export const tokenUpdate = (state="",action) => {
    switch(action.type) {        
        case "tokenUpdate":
            window.localStorage.setItem('token', JSON.stringify(action.value));
            return action.value;
        
        default:
            return JSON.parse(window.localStorage.getItem('token')) || state;
    }
}

export const usernameUpdate = (state="Username",action) => {
    switch(action.type) {        
        case "usernameUpdate":
            window.localStorage.setItem('username', JSON.stringify(action.value));
            return action.value;
        
        default:
            return JSON.parse(window.localStorage.getItem('username')) || state;
    }
}

export const repoUpdate = (state={},action) => {
    switch(action.type) {        
        case "repoUpdate":
            window.localStorage.setItem('repositories', JSON.stringify(action.value));
            return action.value;
        
        default:
            return JSON.parse(window.localStorage.getItem('repositories')) || state;
    }
}