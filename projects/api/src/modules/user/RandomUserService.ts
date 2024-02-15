import { Transaction } from '@untype/pg';
import { singleton } from 'tsyringe';
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { User } from '../../entities';

@singleton()
export class RandomUserService {
    public getRandomUser = async (t: Transaction) => {
        const { name, slug } = await this.generateNameAndSlug(t);
        return { avatarId: null, name, slug };
    };

    public getRandomName = () => {
        return uniqueNamesGenerator({
            dictionaries: [adjectives, animals, colors],
            separator: ' ',
            length: 2,
            style: 'capital',
        });
    };

    private generateNameAndSlug = async (t: Transaction) => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const seed = new Date().getTime();
            const slug = uniqueNamesGenerator({
                dictionaries: [adjectives, animals, colors],
                separator: '_',
                length: 2,
                style: 'lowerCase',
                seed,
            });

            const exists = await User.exists(t, {
                filter: { slug: { equalTo: slug } },
            });

            if (!exists) {
                return {
                    slug,
                    name: uniqueNamesGenerator({
                        dictionaries: [adjectives, animals, colors],
                        separator: ' ',
                        length: 2,
                        style: 'capital',
                        seed,
                    }),
                };
            }
        }
    };
}
