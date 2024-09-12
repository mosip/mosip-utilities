export const githubToken = (val) => {
    return {
        type: "tokenUpdate",
        value: val
    }
}

export const githubRepo = (val) => {
    return {
        type:"repoUpdate",
        value: val
    }
}

export const githubUsername = (val) => {
    return {
        type:"usernameUpdate",
        value: val
    }
}