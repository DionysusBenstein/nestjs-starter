import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner, EntityManager, Repository, DeepPartial, EntityTarget, ObjectLiteral, FindOptionsWhere, DeleteResult, UpdateResult, ObjectId } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

const DEFAULT_ISOLATION_LEVEL: IsolationLevel = 'READ COMMITTED';


// TODO: Make as member of custom generic TransactionalRepository
// For now this function should be used only with binded 'this' context (bind, call or apply)
export function saveWithTransactions<Entity>(data: DeepPartial<Entity>, transactionManager: EntityManager): Promise<DeepPartial<Entity>> {
  if (transactionManager) return transactionManager.save(this.target, data);
  return this.save(data);
}

export function updateWithTransactions<Entity>(
  criteria: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | FindOptionsWhere<Entity>,
  data: DeepPartial<Entity>,
  transactionManager: EntityManager,
): Promise<DeepPartial<UpdateResult>> {
  if (transactionManager) return transactionManager.update(this.target, criteria, data);
  return this.update(criteria, data);
}

export function deleteWithTransactions<Entity>(
  criteria: string | string[] | number | number[] | Date | Date[] | FindOptionsWhere<Entity>,
  transactionManager: EntityManager,
): Promise<DeleteResult> {
  if (transactionManager) return transactionManager.delete(this.target, criteria);
  return this.delete(criteria);
}

export function softDeleteWithTransactions<Entity>(
  criteria: string | string[] | number | number[] | Date | Date[] | FindOptionsWhere<Entity>,
  transactionManager: EntityManager,
): Promise<DeleteResult> {
  if (transactionManager) return transactionManager.softDelete(this.target, criteria);
  return this.softDelete(criteria);
}

export function restoreWithTransactions<Entity>(
  criteria: string | string[] | number | number[] | Date | Date[] | FindOptionsWhere<Entity>,
  transactionManager: EntityManager,
): Promise<DeleteResult> {
  if (transactionManager) return transactionManager.restore(this.target, criteria);
  return this.restore(criteria);
}

// export class TransactionalRepository<Entity extends ObjectLiteral> extends Repository<Entity> {
//   constructor(target: EntityTarget<Entity>, dataSource: DataSource) {
//     super(target, dataSource.createEntityManager());
//   }
//
//   saveWithTransactions(data: DeepPartial<Entity>, transactionManager: EntityManager): Promise<DeepPartial<Entity>> {
//     if (transactionManager) return transactionManager.save(this.target, data);
//     return this.save(data);
//   }
// }

export abstract class ITransactionRunner {
  abstract startTransaction(): Promise<void>;
  abstract commitTransaction(): Promise<void>;
  abstract rollbackTransaction(): Promise<void>;
  abstract releaseTransaction(): Promise<void>;
}

class TransactionRunner implements ITransactionRunner {
  private hasTransactionDestroyed = false;
  constructor(private readonly queryRunner: QueryRunner) { }

  async startTransaction(isolationLevel: IsolationLevel = DEFAULT_ISOLATION_LEVEL): Promise<void> {
    if (this.queryRunner.isTransactionActive) return;
    return this.queryRunner.startTransaction(isolationLevel);
  }

  async commitTransaction(): Promise<void> {
    if (this.hasTransactionDestroyed) return;
    return this.queryRunner.commitTransaction();
  }

  async rollbackTransaction(): Promise<void> {
    if (this.hasTransactionDestroyed) return;
    return this.queryRunner.rollbackTransaction();
  }

  async releaseTransaction(): Promise<void> {
    this.hasTransactionDestroyed = true;
    return this.queryRunner.release();
  }

  get transactionManager(): EntityManager {
    return this.queryRunner.manager;
  }
}

@Injectable()
export class DbTransactionFactory {
  constructor(private readonly dataSource: DataSource) { }

  async createTransaction(): Promise<TransactionRunner> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    return new TransactionRunner(queryRunner);
  }
}
