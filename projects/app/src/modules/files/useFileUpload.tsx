import { promise } from '@untype/toolbox';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useRpc } from '../../api/rpc';

type FileType = 'photo' | 'video' | 'mixed' | 'file';

export const useFileUpload = () => {
    const [mutate] = useRpc('file/upload_image').useMutation();

    const upload = async (type: FileType) => {
        const [file] = await getFiles(type);
        if (!file) {
            throw new Error('Not selected');
        }

        return mutate(file);
    };

    const uploadMultiple = async (type: FileType, limit = 10) => {
        const files = await getFiles(type, limit);

        const result = await Promise.allSettled(files.map((x) => mutate(x)));
        return result.filter(promise.settled).map((x) => x.value);
    };

    return { upload, uploadMultiple };
};

const getFiles = async (mediaType: FileType, limit = 0) => {
    if (mediaType === 'file') {
        const assets = await DocumentPicker.pick({
            type: [DocumentPicker.types.allFiles],
            allowMultiSelection: limit > 1,
        });

        return assets.map((x) => {
            const data = new FormData();
            data.append('file', x as any);
            return data;
        });
    } else {
        const { assets } = await launchImageLibrary({ mediaType, selectionLimit: limit });

        return (
            assets?.map((x) => {
                const data = new FormData();
                data.append('file', {
                    uri: x.uri,
                    type: x.type,
                    name: x.fileName,
                } as any);
                return data;
            }) ?? []
        );
    }
};
