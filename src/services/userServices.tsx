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
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/login`,
        {
          email,
          password,
        }
      );

      if (response.status === 200) {
        const user = response.data.user;
        const token = response.data.token;
        return { success: true, user, token };
      }

      // if you are using axios then this will not be excuted
      // console.log("hii");

    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getUserByToken() {
    // call axios get request to fetch user by token
    try {
      const token = localStorage.getItem("jwt");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/getUser`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        const user = response.data;
        return { success: true, user };
      }
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch user",
      };
    }
  }

  async getAllUsers() {
    // call axios get request to fetch all users
    try {
      const token = localStorage.getItem("jwt");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        return { success: true, users: response.data.users };
      } else {
        return { success: false, message: response.data.error };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async logoutUser() {
    // call axios post request to logout user
    try {
      const token = localStorage.getItem("jwt");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        return { success: true, message: "Logged out successfully" };
      }
    } catch (error: any) {
      console.error("Error logging out:", error);
      return {
        success: false,
        message:
          error?.response?.data?.message || error?.message || "Logout failed",
      };
    }
  }
}

export default new UserServices();
