import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      employeeId: string | null;
      departmentId: string | null;
      departmentName: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    employeeId: string | null;
    departmentId: string | null;
    departmentName: string | null;
  }
}
