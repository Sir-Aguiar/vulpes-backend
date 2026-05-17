import { List } from '@prisma/client';
import { CreateListDto } from '../dto/create-list.dto';
import { GetListsQueryDto } from '../dto/get-lists.dto';
import { UpdateListDto } from '../dto/update-list.dto';

export interface ListWithRelations extends List {
  class?: {
    classId: string;
    name: string;
    code: number;
    professorId: string;
  };
  _count?: {
    taskLists: number;
  };
  submissions: {
    submissionId: string;
    studentId: string;
  }[];
}

export type CreateListData = Omit<CreateListDto, 'taskIds'>;

export abstract class ListRepository {
  abstract create(data: CreateListData): Promise<List>;
  abstract getById(listId: string): Promise<ListWithRelations | null>;
  abstract getByIdAndTaskId(
    listId: string,
    taskId: string,
  ): Promise<ListWithRelations | null>;
  abstract getByClassId(
    classId: string,
    query: GetListsQueryDto,
  ): Promise<{
    lists: Omit<ListWithRelations, 'submissions'>[];
    total: number;
  }>;
  abstract update(listId: string, data: UpdateListDto): Promise<List>;
  abstract delete(listId: string): Promise<void>;
}
