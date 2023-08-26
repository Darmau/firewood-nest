import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class PositiveIntPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (metadata.type === "query") {
      if (metadata.data === "limit" && value < 1) {
        return 10;
      }
      if (metadata.data === "page" && value < 1) {
        return 1;
      }
    }
    return value;
  }
}
