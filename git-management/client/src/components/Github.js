
export const update_username = async(token) => {

    const response = await fetch("http://localhost:5000/user",{
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token})
    });
    
    const res = await response.json();
    return res.username;
}

export const get_repo_list = async(token) => {
    const repo_response = await fetch("http://localhost:5000/repo", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token})
    });

    const repo_res = await repo_response.json();        
    const repo_lst = repo_res.repo;
    return repo_lst;
}

export const get_repo_branch_list = async(token) => {
    const repo_response = await fetch("http://localhost:5000/repo", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token})
    });

    const repo_res = await repo_response.json();        
    const repo_lst = repo_res.repo;
    let repo={};

    for (let i=0; i<repo_lst.length; i++)
    {
        const repo_name = repo_lst[i];
        repo = await update_branch_list(token,repo_name,repo);
    }
    return repo;
}

export const update_branch_list = async(token, repo, repo_name) => {
    const branch_response = await fetch("http://localhost:5000/branch", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token,repo_name:repo_name})
    });
        
    const branch_res = await branch_response.json();
    const branch_lst = branch_res.branches;

    if(typeof branch_lst !== "undefined")
    {
        repo[repo_name]=branch_lst;
    }

    return repo;
}

export const rename_branch = async(token, repo, repo_name, branch_name, new_branch_name) => {        
    const response = await fetch("http://localhost:5000/rename_branch", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token, repo_name:repo_name, old_branch_name:branch_name, new_branch_name:new_branch_name})
    });
    
    const result = await response.json();
    console.log(result);
    return await update_branch_list(token, repo, repo_name);
}

export const create_branch = async(token, repo, repo_name, parent_branch_name, create_branch_name) => {        
    const response = await fetch("http://localhost:5000/create_branch", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token, repo_name:repo_name, parent_branch_name:parent_branch_name, create_branch_name:create_branch_name})
    });
    
    const result = await response.json();
    console.log(result);
    return await update_branch_list(token, repo, repo_name);
}

export const delete_branch = async(token, repo, repo_name, branch_name) => {      
    const response = await fetch("http://localhost:5000/delete_branch", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token, repo_name:repo_name, branch_name:branch_name})
    });

    const result = await response.json();
    console.log(result);
    return await update_branch_list(token, repo, repo_name);
}

export const lock_branch = async(token, repo, repo_name, branch_name) => {      
    const response = await fetch("http://localhost:5000/lock_branch", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token, repo_name:repo_name, branch_name:branch_name})
    });

    const result = await response.json();
    console.log(result);
    return await update_branch_list(token, repo, repo_name);
}

export const unlock_branch = async(token, repo, repo_name, branch_name) => {      
    const response = await fetch("http://localhost:5000/unlock_branch", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token, repo_name:repo_name, branch_name:branch_name})
    });

    const result = await response.json();
    console.log(result);
    return await update_branch_list(token, repo, repo_name);
}

export const create_tag = async(token, repo, repo_name, branch_name, tag_name) => {        
    const response = await fetch("http://localhost:5000/create_tag", {
        method: "POST",
        headers: {"Content-Type" : "application/json"},
        credentials: 'include',
        body:JSON.stringify({token:token, repo_name:repo_name, branch_name:branch_name, tag_name:tag_name})
    });
    
    const result = await response.json();
    console.log(result);
    return await update_branch_list(token, repo, repo_name);
}