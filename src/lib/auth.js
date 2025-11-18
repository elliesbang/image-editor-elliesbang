export function login(email, password) {
  if (!email || !password) {
    return Promise.reject(new Error("이메일과 비밀번호를 입력하세요."));
  }
  return Promise.resolve({ email, role: "user" });
}

export function logout() {
  return Promise.resolve(true);
}
