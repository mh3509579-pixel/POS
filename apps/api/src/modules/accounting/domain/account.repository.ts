import { Account, CreateAccountDTO, UpdateAccountDTO } from '../domain/account.entity.js';

export interface IAccountRepository {
  findAll(): Promise<Account[]>;
  findById(id: number): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  findByType(type: string): Promise<Account[]>;
  create(data: CreateAccountDTO): Promise<Account>;
  update(id: number, data: UpdateAccountDTO): Promise<Account | null>;
  delete(id: number): Promise<boolean>;
  getChildren(parentId: number): Promise<Account[]>;
}
