import axios from "axios";

class UserServices {
  async registerUser(
    name: string,
    email: string,
    password: string,
    avatar?: string
  ) {
    // call axios post request to register user
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/user/register`,
      {
        name,
        email,
        password,
        avatar: avatar || "👤",
      }
    );

    if (response.status === 201) {
      const newUser = response.data.user;
      return { success: true, user: newUser };
    } else {
      return { success: false, message: response.data.error };
    }
  }

  async loginUser(email: string, password: string) {
    // call axios post request to validate user

    //  res.cookie("jwt", token, cookieOptions); store cookie in browser
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/user/login`,
      {
        email,
        password,
      },
      {
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      const user = response.data.user;
      return { success: true, user };
    } else {
      return { success: false, message: response.data.error };
    }
  }

  async getUserByToken() {
    // call axios get request to fetch user by token
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/getUser`,
        {
          withCredentials: true, // Include cookies in the request
        }
      );
      if (response.status === 200) {
        const user = response.data;
        return { success: true, user };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || "Failed to fetch user data",
      };
    }
  }

  async getAllUsers() {
    // call axios get request to fetch all users
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/user/all`,
      {
        withCredentials: true, // Include cookies in the request
      }
    );

    if (response.status === 200) {
      return { success: true, users: response.data.users };
    } else {
      return { success: false, message: response.data.error };
    }
  }
}

export default new UserServices();
