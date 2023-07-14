import {combineReducers} from "redux";

import { tokenUpdate, usernameUpdate, repoUpdate } from "./githubAPI";

const rootReducer = combineReducers({
    tokenUpdate, usernameUpdate, repoUpdate
})

export default rootReducer