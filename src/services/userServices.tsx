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
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/user/login`,
      {
        email,
        password,
      }
    );

    if (response.status === 200) {
      const user = response.data.user;
      return { success: true, user };
    } else {
      return { success: false, message: response.data.error };
    }
  }

  async getAllUsers() {
    // call axios get request to fetch all users
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`);

    if (response.status === 200) {
      return { success: true, users: response.data.users };
    } else {
      return { success: false, message: response.data.error };
    }
  }
}

export default new UserServices();
