import { gql } from "@apollo/client";

export const EMPLOYEES_PAGE = gql`
  query EmployeesPage($filter: EmployeeFilter, $sort: EmployeeSort, $page: Int!, $pageSize: Int!) {
    employeesPage(filter: $filter, sort: $sort, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        email
        role
        teachingAssignments {
          className
          subjectName
        }
        attendanceSummary {
          percentage
        }
      }
      totalCount
      page
      pageSize
    }
  }
`;

export const SIGN_UP = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      token
      employee {
        id
        email
        name
        role
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      employee {
        id
        email
        name
        role
      }
    }
  }
`;

export const EMPLOYEE_BY_ID = gql`
  query EmployeeById($id: ID!) {
    employee(id: $id) {
      id
      name
      email
      role
      dateOfBirth
      teachingAssignments {
        className
        subjectName
      }
      attendanceSummary {
        percentage
      }
    }
  }
`;

export const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($id: ID!, $input: UpdateEmployeeInput!) {
    updateEmployee(id: $id, input: $input) {
      id
      name
      email
      role
      teachingAssignments {
        className
        subjectName
      }
      attendanceSummary {
        percentage
      }
    }
  }
`;
