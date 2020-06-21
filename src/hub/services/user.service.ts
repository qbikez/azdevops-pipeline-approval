import { SDK } from "../mocks/sdkMock";

export class UserService {
  constructor() {
    // SDK.init();
  }

  isLoggedUser(id: string): boolean {
    return SDK.getUser().id === id;
  }
}
